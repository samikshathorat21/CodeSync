package com.codesync.security;

import com.codesync.entity.User;
import com.codesync.entity.UserRole;
import com.codesync.repository.UserRepository;
import com.codesync.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        
        return loadUserById(user.getId());
    }

    public UserPrincipal loadUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        List<String> roles = userRoleRepository.findByUserId(user.getId()).stream()
                .map(role -> role.getRole().name())
                .collect(Collectors.toList());

        return UserPrincipal.fromUser(user, roles);
    }
}
